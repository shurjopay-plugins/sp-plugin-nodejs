# shurjoPay2 integration for nodejs sites

## Ocean Freight, Air Freight

- Generate token for merchants
- perform checkout
- Check order status
- Verify order id

## Install

```shell
# npm versions > 5
npm install spnodejs
```

## Docs/Usage

Loading the module gets us a factory function, calling it instantiates the module.

```javascript
const sp = require('spnodejs')();
```

Initiate the checkout with order data and use a callback to get the checkout url `sp.checkout(params, callback)`

```javascript
sp.checkout({
    amount: '10',
    order_id: 'sp315689',
    customer_name: 'ATM Fahim',
    customer_address: 'Dhaka',
    customer_phone: '01534303074',
    customer_city: 'Dhaka',
    customer_post_code: '1212',
    client_ip: '102.101.1.1'
}, function (checkout_url, resp_data) {
    // console.log('checkout url is ' + checkout_url);
    // now redirect your users to the checkout_url
});
```

Now later check the payment status or verify with the methods

```javascript
sp.verify(order_id, (resp_data) => {
    // use the response data as you need
    console.dir(resp_data);
});
```

Similarly, use `check_status` method.

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
