const axios = require("axios");
const moment = require("moment");
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

//Tracking error in log file
const logger = createLogger({
  format: combine(label({ label: "shurjopay" }), timestamp(), myFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "shurjopay-plugin.log" }),
  ],
});

function randomString(length) {
  return Math.round(
    Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)
  )
    .toString(36)
    .slice(1);
}

function Shurjopay() {
  const _this = this;

  this.data = {};

  this.randomString = randomString;

  this.log = (message, level) => {
    logger.log({
      level: level,
      message: message,
    });
  };

  //Getting credentials from merchant as parameter by calling config
  this.config = function (
    root_url,
    merchant_username,
    merchant_password,
    merchant_key_prefix,
    return_url
  ) {
    this.credentials = {
      root_url: root_url,
      merchant_username: merchant_username,
      merchant_password: merchant_password,
      merchant_key_prefix: merchant_key_prefix,
      return_url: return_url,

      get token_url() {
        return this.root_url + "/api/get_token";
      },
      get verification_url() {
        return this.root_url + "/api/verification";
      },
      get payment_status_url() {
        return this.root_url + "/api/payment-status";
      },
    };
  };

  /**
   * Return authentication token for shurjoPay payment gateway system.
   * Setup shurjopay.properties file.
   *
   * @return authentication details with valid token
   * @throws ShurjopayException while merchant username and password is invalid.
   */
  this.authentication = function (callback) {
    axios
      .post(this.credentials.token_url, {
        username: this.credentials.merchant_username,
        password: this.credentials.merchant_password,
      })
      .then(function (response) {
        _this.data.sp_token = {
          token: response.data.token,
          token_type: response.data.token_type,
          token_create_time: response.data.TokenCreateTime, //eg. 2022-01-13 10:55:12am
          token_valid_duration: response.data.expires_in, //eg. 3600
        };
        callback(response.data);
      })
      .catch(function (error) {
        _this.log(
          "Did not receive auth token from shurjopay. Check your credentials.",
          "error"
        );
      });
  };

  /**
   * This method is used for making payment.
   *
   * @param Payment request object. See the shurjoPay version-2 integration documentation(beta).docx for details.
   * @return Payment response object contains redirect URL to reach payment page,token_details,order_id, form_data to verify order in shurjoPay.
   * @throws ShurjopayException while merchant username and password is invalid.
   * @throws ShurjopayPaymentException while {#link PaymentReq} is not prepared properly or {#link HttpClient} exception
   */
  this.makePayment = function (
    checkout_params,
    checkout_callback,
    error_handler
  ) {
    this.authentication((data) => {
      axios
        .post(data.execute_url, {
          ...checkout_params,
          prefix: _this.credentials.merchant_key_prefix,
          store_id: data.store_id,
          token: data.token,
          return_url: _this.credentials.return_url,
          cancel_url: _this.credentials.return_url,
        })
        .then(function (response) {
          checkout_callback(response.data);
        })
        .catch(function (checkout_error) {
          error_handler(checkout_error);
        });
    });
  };

  /**
   * This method is used for verifying order by order id which could be get by payment response object
   *
   * @param orderId
   * @return order object if order verified successfully
   * @throws ShurjopayException while merchant user name and password is invalid.
   * @throws ShurjopayVerificationException while token_type, token, order id is invalid or payment is not initiated properly or {#link HttpClient} exception
   */
  this.verifyPayment = function (order_id, callback, error_handler) {
    this.authentication((data) => {
      axios({
        method: "post",
        url: this.credentials.verification_url,
        headers: {
          "content-type": "application/json",
          Authorization: data.token_type + " " + data.token,
        },
        data: { order_id: order_id },
      })
        .then(function (response) {
          callback(response.data);
        })
        .catch(function (verify_error) {
          error_handler(verify_error);
        });
    });
  };

  /**
   * This method is used for verifying order by order id which could be get by payment response object
   *
   * @param  orderId
   * @return order object if order verified successfully
   * @throws ShurjopayException while merchant user name and password is invalid.
   * @throws ShurjopayVerificationException while order id is invalid or payment is not initiated properly or {#link HttpClient} exception
   */
  this.paymentStatus = function (order_id, callback, error_handler) {
    this.authentication((data) => {
      axios({
        method: "post",
        url: this.credentials.payment_status_url,
        headers: {
          "content-type": "application/json",
          Authorization: data.token_type + " " + data.token,
        },
        data: { order_id: order_id },
      })
        .then(function (response) {
          callback(response.data);
        })
        .catch(function (verify_error) {
          error_handler(verify_error);
        });
    });
  };
  //validate token  expiring time
  this.token_valid = function () {
    let create_time_obj = moment(
      _this.data.sp_token.token_create_time,
      "YYYY-MM-DD hh:mm:ssa"
    );
    let dur_seconds = moment().subtract(create_time_obj).format("ss");
    return dur_seconds < _this.data.sp_token.token_valid_duration;
  };
}

module.exports = function () {
  return new Shurjopay();
};
