/**
 * If the environment variable "STRICT_SSL" is defined as "false", it doesn't require SSL certificates to be valid.
 * This is used in requests to define the value of the "strictSSL" option.
 */
export default function getStrictSsl() {
    return !(process.env.STRICT_SSL === 'false' || process.env.strict_ssl === 'false')
}
