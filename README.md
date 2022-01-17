# shurjoPay2 integration for nodejs sites

## Checkout, Verify

- Generate token for merchants
- perform checkout
- Check order status
- Verify order id

## Install

```shell
# npm versions > 5
npm i shurjopay
```

## Docs/Usage

__Example integration use case scenario is expressCart(https://github.com/mrvautin/expressCart)__

Loading the module gets us a factory function, calling it instantiates the module.

```javascript
const sp_factory = require('shurjopay');
const sp = sp_factory();
```

The object provides methods that you need to use are:

- Payment operation methods: `checkout`, `verify`, `check_status`, `token_valid`.
- Configuration methods: `configure_merchant`
- Error handler methods: `gettoken_error_handler`, `checkout_error_handler`
- Callback handler methods: `checkout_callback`
- Module's own settings object: `sp.settings`
- Store session accessor: `sp.session`

#### In your route controllers, your workflow is (using three routes):

- At checkout->payment method, selecting shurjopay lands the buyer in _checkout_action_ route, where you initiate the transaction with cart details
- At first configure the shurjopay object to set the merchant info
- Then set the checkout_return and checkout_cancel callback url
- Then set the session accessor
- Then set error handlers, checkout callback
- Then call the checkout method


At first, you need to configure the object. The minimum config/environment variables that your site need to maintain(config related to shurjopay) are:

```json
{
  "mode": "sandbox",
  "client_id": "your merchant id",
  "client_secret": "your merchant password or secret token",
  "client_store_id": "1",
  "client_key_prefix": "sp",
  "currency": "BDT"
}
```

### An example route controller

```javascript
const express = require('express');
const { indexOrders, indexTransactions } = require('../indexing');
const { getId, sendEmail, getEmailTemplate } = require('../common');
const { getPaymentConfig } = require('../config');
const { emptyCart } = require('../cart');
const shurjopay = require('shurjopay')();
const router = express.Router();

router.get('/checkout_cancel', (req, res, next) => {
    // return to checkout for adjustment or repayment
    res.redirect('/checkout/information');
});

router.get('/checkout_return', (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;
    const paymentConfig = getPaymentConfig('shurjopay');
    const paymentId = req.query.order_id;

    let paymentApproved = true;
    let paymentMessage = '';
    let paymentDetails = '';

    const paymentOrderId = req.session.orderId; // this is the insert id
    let paymentStatus = 'Approved';

    // fully approved
    paymentApproved = true;
    paymentStatus = 'Paid';
    paymentMessage = 'Succeeded';
    paymentDetails = `<p><strong>Order ID: </strong>${paymentOrderId}</p><p><strong>Transaction ID: </strong>${paymentId}</p>`;

    // clear the cart
    if(req.session.cart){
        emptyCart(req, res, 'function');
    }

    // Create our transaction
    const transaction = db.transactions.insertOne({
        gateway: 'shurjopay',
        gatewayReference: paymentId,
        gatewayMessage: '',
        approved: true,
        amount: req.session.totalCartAmount,
        currency: paymentConfig.currency,
        customer: getId(req.session.customerId),
        created: new Date(),
        order: getId(paymentOrderId)
    });

    const transactionId = transaction.insertedId;

    // Index transactions
    indexTransactions(req.app);

    // update the order status
    db.orders.updateOne({ _id: getId(paymentOrderId) }, { $set: { orderStatus: paymentStatus, transaction: transactionId } }, { multi: false }, (err, numReplaced) => {
        if(err){
            console.info(err.stack);
        }
        db.orders.findOne({ _id: getId(paymentOrderId) }, async (err, order) => {
            if(err){
                console.info(err.stack);
            }

            // add to lunr index
            indexOrders(req.app)
                .then(() => {
                    // set the results
                    req.session.messageType = 'success';
                    req.session.message = paymentMessage;
                    req.session.paymentEmailAddr = order.orderEmail;
                    req.session.paymentApproved = paymentApproved;
                    req.session.paymentDetails = paymentDetails;

                    const paymentResults = {
                        message: req.session.message,
                        messageType: req.session.messageType,
                        paymentEmailAddr: req.session.paymentEmailAddr,
                        paymentApproved: req.session.paymentApproved,
                        paymentDetails: req.session.paymentDetails
                    };

                    // send the email with the response
                    // TODO: Should fix this to properly handle result
                    sendEmail(req.session.paymentEmailAddr, `Your payment with ${config.cartTitle}`, getEmailTemplate(paymentResults));

                    res.redirect(`/payment/${order._id}`);
                });
        });
    });
});

// The homepage of the site
router.post('/checkout_action', (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;
    const spConfig = getPaymentConfig('shurjopay');

    // configure the shurjopayment object
    shurjopay.configure_merchant(spConfig.client_id, spConfig.client_secret, spConfig.client_store_id, spConfig.client_key_prefix, spConfig.currency);

    // TODO: make a configure function for this
    shurjopay.settings.checkout_return_url = `${config.baseUrl}/shurjopay/checkout_return`;
    shurjopay.settings.checkout_cancel_url = `${config.baseUrl}/shurjopay/checkout_cancel`;

    shurjopay.session = req.session;

    const order_id = shurjopay.randomString(12);

    shurjopay.gettoken_error_handler = function (error){
        req.session.message = 'There was an error processing your payment. You have not been charged and can try again.';
        req.session.messageType = 'danger';
        console.log(error);
        res.redirect('/checkout/information');
    };
    shurjopay.checkout_error_handler = function (error){
        req.session.message = 'There was an error processing your payment. You have not been charged and can try again.';
        req.session.messageType = 'danger';
        console.log(error);
        res.redirect('/checkout/information');
    };
    shurjopay.checkout_callback = function (checkout_url, response_data){
        // if there is no items in the cart then render a failure
        if(!req.session.cart){
            req.session.message = 'The are no items in your cart. Please add some items before checking out';
            req.session.messageType = 'danger';
            res.redirect('/');
            return;
        }
        req.session.paymentId = response_data.sp_order_id;
        req.session.order_id = order_id;
        // new order doc
        const orderDoc = {
            order_id: order_id,
            orderPaymentId: response_data.sp_order_id,
            orderPaymentGateway: 'shurjopay',
            orderTotal: req.session.totalCartAmount,
            orderShipping: req.session.totalCartShipping,
            orderItemCount: req.session.totalCartItems,
            orderProductCount: req.session.totalCartProducts,
            orderCustomer: getId(req.session.customerId),
            orderEmail: req.session.customerEmail,
            orderCompany: req.session.customerCompany,
            orderFirstname: req.session.customerFirstname,
            orderLastname: req.session.customerLastname,
            orderAddr1: req.session.customerAddress1,
            orderAddr2: req.session.customerAddress2,
            orderCountry: req.session.customerCountry,
            orderState: req.session.customerState,
            orderPostcode: req.session.customerPostcode,
            orderPhoneNumber: req.session.customerPhone,
            orderComment: req.session.orderComment,
            orderStatus: response_data.transactionStatus,
            orderDate: new Date(),
            orderProducts: req.session.cart,
            orderType: 'Single'
        };

        if(req.session.orderId){
            // we have an order ID (probably from a failed/cancelled payment previosuly) so lets use that.

            // send the order to shurjopay
            res.redirect(checkout_url);
        }else{
            // no order ID so we create a new one
            db.orders.insertOne(orderDoc, (err, newDoc) => {
                if(err){
                    console.info(err.stack);
                }
                // get the new ID
                const newId = newDoc.insertedId;

                // set the order ID in the session
                req.session.orderId = newId;

                // send the order to Paypal
                res.redirect(checkout_url);
            });
        }
    };

    // now trigger the actual checkout
    shurjopay.checkout({
        amount: req.session.totalCartAmount,
        order_id: order_id,
        customer_name: `${req.session.customerFirstname} ${req.session.customerLastname}`,
        customer_address: req.session.customerAddress1,
        customer_phone: req.session.customerPhone,
        customer_city: req.session.customerState,
        customer_post_code: req.session.customerPostcode,
        client_ip: 'unknown'
    });
});

module.exports = router;

```

<!--
## Contact

Minhajul Anwar; [resgef.com][resgef-url], Dhaka, Bangladesh.
<br>**Email:** [contact@resgef.com](mailto:contact@resgef.com)

## Questions or need help?

Come talk to us on the [GitHub discussion][gh-discussion]

## Social Media and links

[Twitter](https://twitter.com/intent/follow?original_referer=https%3A%2F%2Fgithub.com%2FMinhajulAnwar&screen_name=MinhajulAnwar) &nbsp;&nbsp;
[GitHub-Blog](https://minhajme.github.io/blog/) &nbsp;&nbsp;
-->
<br>[https://resgef.com][resgef-url] &nbsp;&nbsp;

[ff-introsite-gh-pages]: https://freightforward.github.io

[ff-doc-gh-pages]: https://freightforward.github.io/docs/

[gh-discussion]: https://github.com/minhajme/sp2nodejs/discussions

[dev-gh]: https://github.com/minhajme

[resgef-url]: https://resgef.com
