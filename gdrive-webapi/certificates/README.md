# Gerar chave SSL

- Para gerar sua própria chave você precisa:
  - Instalar o [MKCert](https://github.com/FiloSottile/mkcert) (`brew install mkcert`)

  - Colocar seu usuario como usuário válido para certificado, com o comando
     `mkcert -install`
  - Gerar a Key e o Cert:
`mkcert -key-file key.pem -cert-file cert.pem 0.0.0.0 localhost 127.0.0.1 ::1`
