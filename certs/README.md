# Place ssl certs in this directory

I used these instructions as a reference:
<https://gist.github.com/cecilemuller/9492b848eb8fe46d462abeb26656c4f8>

Got to /webgs/certs (this dir)

Create a file named domains.ext, and copy the following into it:

    authorityKeyIdentifier=keyid,issuer
    basicConstraints=CA:FALSE
    keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
    subjectAltName = @alt_names
    [alt_names]
    DNS.1 = {your domain name}
    DNS.2 = localhost

Change DNS values to match your domain name, or use localhost as DNS.1 and delete DNS.2 if unnamed. Then save the file.


I replaced localhost with my machine name, {your domain name} in the first and last openssl command. It should work with local host as well. I wanted to make sure I could access webgs from a remote client and localhost usually translates to 127.0.0.1 not 0.0.0.0.

Create Certificate Authority:

    openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout RootCA.key -out RootCA.pem -subj "/C=US/CN=localhost"
    openssl x509 -outform pem -in RootCA.pem -out RootCA.crt

Create Certificates (uses CA files created above):

    openssl req -new -nodes -newkey rsa:2048 -keyout localhost.key -out localhost.csr -subj "/C=US/ST=YourState/L=YourCity/O=Example-Certificates/CN=localhost.local"
    openssl x509 -req -sha256 -days 1024 -in localhost.csr -CA RootCA.pem -CAkey RootCA.key -CAcreateserial -extfile domains.ext -out localhost.crt



On linux to get chrome to trust the CA:
chrome://settings/certificates -> Authorities -> Import
select RootCA.pem
check all of the boxes and hit ok.

Firefox:
about:preferences#privacy
at the bottom of the page in security
hit 'View Certificates' -> Authorities -> Import
Select the RootCA.pem
Check all of the boxes and hit ok.


On mac add certs to keychain using Keychain Access. This should allow all browsers to see the certs.


To start Webgs:

    python3 start_webgs.py -HOST {your domain name} -CERT localhost.crt -KEY localhost.key

Update -HOST, -CERT and -KEY as needed, -CERT and -KEY default to localhost.crt and localhost.key respectivly, so they are not needed if that is the names you chose.

    python3 start_webgs.py -HOST {your domain name}


Or, start with http:

    python3 start_webgs.py -DEV True