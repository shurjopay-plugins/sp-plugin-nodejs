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

# Postmane Documentations

    This document will illustrate the overall request and response flow.
    URL : https://documenter.getpostman.com/view/6335853/U16dS8ig

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

Check over the example folder.

### Response format examples

#### verify

```javascript
response_data =
    [
        {
            id: 3741,
            order_id: 'sp61e678dd003c6',
            currency: 'BDT',
            amount: 500,
            payable_amount: 500,
            discsount_amount: null,
            disc_percent: 0,
            usd_amt: 0,
            usd_rate: 0,
            card_holder_name: null,
            card_number: null,
            phone_no: '01534303074',
            bank_trx_id: '61e678eb',
            invoice_no: 'sp61e678dd003c6',
            bank_status: 'Success',
            customer_order_id: 'c4xyxpytzk00',
            sp_code: 1000,
            sp_massage: 'Success',
            name: 'Minhajul Anwar',
            email: null,
            address: '330 NIH BUT DHK',
            city: 'Dhaka',
            value1: null,
            value2: null,
            value3: null,
            value4: null,
            transaction_status: null,
            method: 'Nagad',
            date_time: '2022-01-18 14:23:07'
        }
    ]

```

#### check_status

```javascript
[
    {
        id: 3754,
        order_id: 'sp61e69482835b5',
        currency: 'BDT',
        amount: 500,
        payable_amount: 500,
        discsount_amount: null,
        disc_percent: 0,
        usd_amt: 0,
        usd_rate: 0,
        card_holder_name: null,
        card_number: null,
        phone_no: '01534303074',
        bank_trx_id: '61e6948f',
        invoice_no: 'sp61e69482835b5',
        bank_status: 'Success',
        customer_order_id: 'dvijbs4f5s00',
        sp_code: 1000,
        sp_massage: 'Success',
        name: 'Minhajul Anwar',
        email: null,
        address: '330 NIH BUT DHK',
        city: 'Dhaka',
        value1: null,
        value2: null,
        value3: null,
        value4: null,
        transaction_status: null,
        method: 'Nagad',
        date_time: '2022-01-18 16:21:03'
    }
]
```

#### checkout

```javascript
response_data = {
    checkout_url: 'https://sandbox.securepay.shurjopayment.com/spaycheckout/?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc2FuZGJveC5zaHVyam9wYXltZW50LmNvbVwvYXBpXC9sb2dpbiIsImlhdCI6MTY0MjQ5NTk3MiwiZXhwIjoxNjQyNDk5NTcyLCJuYmYiOjE2NDI0OTU5NzIsImp0aSI6Im1JcEFrNHJPZ1h4TklWVG4iLCJzdWIiOjEsInBydiI6IjgwNWYzOWVlZmNjNjhhZmQ5ODI1YjQxMjI3ZGFkMGEwNzZjNDk3OTMifQ.k_RnbXwWIEc8_NiGgR3c3d0GQhASXv_fjK2S_Wz_Ksw&order_id=sp61e67fe5a7a17',
    amount: 500,
    currency: 'BDT',
    sp_order_id: 'sp61e67fe5a7a17',
    customer_order_id: 'aobws09sa800',
    customer_name: 'Minhajul Anwar',
    customer_address: '330 NIH BUT DHK',
    customer_city: 'Dhaka',
    customer_phone: '01534303074',
    customer_email: null,
    client_ip: 'unknown',
    intent: 'sale',
    transactionStatus: 'Initiated'
}

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
