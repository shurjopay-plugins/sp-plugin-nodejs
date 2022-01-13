module.exports = {
    sandbox: true,
    get root_url() {
        let sandbox_url = 'https://sandbox.shurjopayment.com/';
        let live_url = 'https://live.shurjopayment.com/';
        return this.sandbox ? sandbox_url : live_url;
    },
    get token_url() {
        return this.root_url + 'api/get_token';
    },
    get checkout_return_url() {
        return this.root_url + 'response';
    },
    get checkout_cancel_url() {
        return this.root_url + 'response';
    },
    get verification_url() {
        return this.root_url + 'api/verification';
    },
    get payment_status_url() {
        return this.root_url + 'api/payment-status';
    },
    merchant_store_id: 1,
    merchant_username: 'sp_sandbox',
    merchant_password: 'pyyk97hu&6u6',
    merchant_key_prefix: 'sp',
    merchant_default_currency: 'BDT'
}