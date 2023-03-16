# ![alt text](https://shurjopay.com.bd/dev/images/shurjoPay.png) Nodejs package (plugin)

![Made With](https://badgen.net/badge/Made%20with/javascript)
[![Test Status](https://github.com/rust-random/rand/workflows/Tests/badge.svg?event=push)]()
![NPM](https://img.shields.io/npm/l/sp-plugin)
![version](https://badgen.net/npm/v/shurjopay)

Official shurjoPay nodejs package (plugin) for merchants or service providers to connect with shurjoPay Payment Gateway v2.1 developed and maintained by shurjoMukhi Limited.

This plugin package can be used with any nodejs application or framework .

This plugin package makes it easy for you to integrate with shurjoPay v2.1 with just three method calls:

- checkout()
- verify()
- check_status()

Also reduces many of the things that you had to do manually

- Handles http request and errors
- JSON serialization and deserialization
- Authentication during checkout and verification of payments

## Audience

This document is intended for the developers and technical personnel of merchants and service providers who want to integrate the shurjoPay online payment gateway using python.

## How to use this shurjoPay Plugin

#### Use `npm` to install this plugin inside your project environment.

```
npm install shurjopay
```

#### Create a .env file inside your project's root directory. Here is a sample .env configuration.

```
SP_USERNAME=sp_sandbox
SP_PASSWORD=pyyk97hu&6u6
SP_PREFIX=sp
SP_STORE_ID=1
DEFAULT_CURRENCY=BDT
```

#### After that, you can initiate payment request to shurjoPay using our package the way you want based on your application. Here we are providing a basic example code snippet for you.

```JavaScript
require("dotenv").config();
const shurjopay = require("shurjopay")();
// shurjopay.is_live();  # Needed for live environment
// NOTE: Do not call is_live() function when you are using the sandbox environment

with(process.env){
  shurjopay.configure_merchant(
    SP_USERNAME,
    SP_PASSWORD,
    SP_STORE_ID,
    SP_PREFIX,
    DEFAULT_CURRENCY
  );
}
```

```JavaScript

shurjopay.checkout({
      "amount":1000,
      "order_id":"nx10t1",
      "return_url": "https://sandbox.shurjopayment.com/response",
      "cancel_url": "https://sandbox.shurjopayment.com/response",
      "customer_name":"Shanto",
      "customer_address":"Mohakhali",
      "client_ip": "102.324.0.5",
      "customer_phone":"01517162394",
      "customer_city":"Dhaka",
      "customer_post_code":"1229",
},
(response_data) => {
  // TODO Handle response from shurjopay and update your system
  // NOTE 'checkout_url' in response_data can be used to redirect consumers to shurjopay landing page
},
(error) => {
  // TODO Handle error response
});

```

#### Payment verification can be done after each transaction with shurjopay order id.

```JavaScript

shurjopay.verify(order_id, (response_data) => {
  // TODO Handle response from shurjopay and update your system
},
(error) => {
  // TODO Handle error response
});

```

#### That's all! Now you are ready to use the nodejs plugin to seamlessly integrate with shurjoPay to make your payment system easy and smooth.

## References

1. [Nodejs example application](https://github.com/shurjopay-plugins/sp-plugin-usage-examples/tree/main/node-app-node-plugin) showing usage of the nodejs plugin.
2. [Sample applications and projects](https://github.com/shurjopay-plugins/sp-plugin-usage-examples) in many different languages and frameworks showing shurjopay integration.
3. [shurjoPay Postman site](https://documenter.getpostman.com/view/6335853/U16dS8ig) illustrating the request and response flow using the sandbox system.
4. [shurjopay Plugins](https://github.com/shurjopay-plugins) home page on github

## License

This code is under the [MIT open source License](LICENSE).

#### Please [contact](https://shurjopay.com.bd/#contacts) with shurjoPay team for more detail.

### Copyright ©️2023 [ShurjoMukhi Limited](https://shurjopay.com.bd/)
