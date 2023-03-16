module.exports = {
    sandbox: true,
    sandbox_url: 'https://sandbox.shurjopayment.com/',
    live_url: 'https://engine.shurjopayment.com/',
    checkout_return_url: '',
    checkout_cancel_url: '',
    merchant_store_id: 1,
    merchant_username: '',
    merchant_password: '',
    merchant_key_prefix: 'sp',
    merchant_default_currency: 'BDT',

    get root_url(){
        return this.sandbox ? this.sandbox_url : this.live_url;
    },
    get token_url(){
        return this.root_url + 'api/get_token';
    },
    get verification_url(){
        return this.root_url + 'api/verification';
    },
    get payment_status_url(){
        return this.root_url + 'api/payment-status';
    },
};
