const express = require('express');
const { indexOrders, indexTransactions } = require('../indexing');
const { getId, sendEmail, getEmailTemplate } = require('../common');
const { getPaymentConfig } = require('../config');
const { emptyCart } = require('../cart');
const shurjopay = require('shurjopay')();
const router = express.Router();

const spConfig = getPaymentConfig('shurjopay');
// configure the shurjopayment object
shurjopay.configure_merchant(spConfig.client_id, spConfig.client_secret, spConfig.client_store_id, spConfig.client_key_prefix, spConfig.currency);

router.get('/checkout_cancel', (req, res, next) => {
    const db = req.app.db;
    db.orders.deleteOne({ orderPaymentId: req.query.order_id });
    req.session.message = 'payment cancelled';
    req.session.messageType = 'danger';
    console.log(req.session.message);
    res.redirect('/checkout/information');
});

router.get('/checkout_return', (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;
    const paymentConfig = getPaymentConfig('shurjopay');
    const paymentId = req.query.order_id;

    shurjopay.verify(paymentId, async (payment_info_list) => {
        let redirect_url = '/checkout/information';
        for(const i in payment_info_list){
            if(payment_info_list[i].sp_code == 1000){
                const paymentOrderId = req.session.orderId; // this is the insert id

                // fully approved
                const paymentApproved = true;
                const paymentStatus = 'Paid';
                const paymentMessage = 'Succeeded';
                const paymentDetails = `<p><strong>Order ID: </strong>${paymentOrderId}</p><p><strong>Transaction ID: </strong>${paymentId}</p>`;

                // clear the cart
                if(req.session.cart){
                    await emptyCart(req, res, 'function');
                }

                // Create our transaction
                const transaction = db.transactions.insertOne({
                    gateway: `shurjopay-${payment_info_list[i].method}`,
                    gatewayReference: paymentId,
                    bank_trx_id: payment_info_list[i].bank_trx_id,
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
                await indexTransactions(req.app);

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

                                redirect_url = `/payment/${order._id}`;
                            });
                    });
                });
            }else{
                req.session.message = payment_info_list[i].sp_massage;
                req.session.messageType = 'danger';
            }
        }
        res.redirect(redirect_url);
    }, (error) => {
        req.session.message = `There was an error processing your payment. You have not been charged and can try again.${error}`;
        req.session.messageType = 'danger';
        console.error(error);
        res.redirect('/checkout/information');
    });
});

// The homepage of the site
router.post('/checkout_action', (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;

    const order_id = shurjopay.randomString(12);

    shurjopay.gettoken_error_handler = function (error){
        req.session.message = `There was an error processing your payment. You have not been charged and can try again.${error}`;
        req.session.messageType = 'danger';
        console.log(error);
        res.redirect('/checkout/information');
    };
    shurjopay.checkout_error_handler = function (error){
        req.session.message = `There was an error processing your payment. You have not been charged and can try again.${error}`;
        req.session.messageType = 'danger';
        console.log(error);
        res.redirect('/checkout/information');
    };

    // now trigger the checkout
    shurjopay.checkout({
        amount: req.session.totalCartAmount,
        order_id: order_id,
        return_url: `${config.baseUrl}/shurjopay/checkout_return`,
        cancel_url: `${config.baseUrl}/shurjopay/checkout_cancel`,
        customer_name: `${req.session.customerFirstname} ${req.session.customerLastname}`,
        customer_address: req.session.customerAddress1,
        customer_phone: req.session.customerPhone,
        customer_city: req.session.customerState,
        customer_post_code: req.session.customerPostcode,
        client_ip: 'unknown'
    }, (response_data, checkout_url) => {
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
                // set the order ID in the session
                req.session.orderId = newDoc.insertedId;

                // send the order to gateway payment handler
                res.redirect(checkout_url);
            });
        }
    });
});

module.exports = router;
