// Requiring module
const assert = require('assert');
const settings = require("../settings");
const sP = require('../index')();

// We can group similar tests inside a 'describe' block
describe("getToken, Checkout, Verify, CheckStatus", () => {
    before(() => {
        //console.log("This part executes once before all tests");
    });

    after(() => {
        //console.log("This part executes once after all tests");
    });

    // We can add nested blocks for different tests
    describe("Checkout", () => {
        beforeEach(() => {
            console.log("Test checkout");
        });

        it("Is checkout working properly", () => {
            sP.checkout({
                amount: '10',
                order_id: 'sp315689',
                customer_name: 'ATM Fahim',
                customer_address: 'Dhaka',
                customer_phone: '01534303074',
                customer_city: 'Dhaka',
                customer_post_code: '1212',
                client_ip: '102.101.1.1'
            }, function (resp_data) {
                //assert('checkout_url2' in resp_data);
                //assert('sp_order_id' in resp_data);
                //assert('transactionStatus' in resp_data);
                assert.equal(resp_data.transactionStatus, 'Initiated');
            });
        });
    });

    /*
    describe("Verify", () => {
        beforeEach(() => {
            console.log("executes before every test");
        });

        it("Is returning 4 when adding 2 + 3", () => {
            assert.equal(2 + 3, 4);
        });

        it("Is returning 8 when multiplying 2 * 4", () => {
            assert.equal(2 * 4, 8);
        });
    });
    describe("Check Status", () => {
        beforeEach(() => {
            console.log("executes before every test");
        });

        it("Is returning 4 when adding 2 + 3", () => {
            assert.equal(2 + 3, 4);
        });

        it("Is returning 8 when multiplying 2 * 4", () => {
            assert.equal(2 * 4, 8);
        });
    });
    */
});
