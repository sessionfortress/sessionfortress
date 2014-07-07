
var config =
{
	// Server hosting the website to protect
        backend_server: 'http://127.0.0.1:8080',

	// Port on which to listen to for HTTPS connections
        local_port: 443,

	// Maximum size of POST body
        max_post_size: 1024*1024,

	// Regexp describing which paths on website require the session cookie
        authenticated_paths: "/([a-z-_]+\\.php)?$",

	// The name of the session cookie
        session_cookie: 'PHPSESSID',

	// The domain used by your session cookies
	topdomain: 'x.com',

	// Separate origin for the login page
        login_domain: 'login.x.com',

	// URL of the original login form (will be redirected)
        login_page: "https://www.x.com/login.php",

	// Content security policy of secure login origin
        login_csp: "script-src nonce-000000000000; frame-src 'none'; object-src 'none'",

	// Certificates of the website
	// Can use name-based virtual hosts with certificate selected from SNI
        certificates: {
                '__DEFAULT__': {
                        cert: '/etc/ssl/website.chain',
                         key: '/etc/ssl/website.key'
                }
        }
};

for(var i in config) exports[i] = config[i];
