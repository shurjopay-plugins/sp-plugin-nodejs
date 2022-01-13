const sp = require('../index')();

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
    console.log('checkout url is ' + checkout_url);
    console.log('Is token valid? ' + sp.token_valid());
    sp.verify((resp_data) => {
        console.log('verify');
        console.dir(resp_data);
    });
    sp.check_status((resp_data) => {
        console.log('check status');
        console.dir(resp_data);
    });
});