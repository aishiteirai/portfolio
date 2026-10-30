# Portfólio · Ryan Corazza

Portfólio em uma página: um sistema solar em three.js em que cada projeto é um planeta em órbita, e um gato de nebulosa que brinca com uma galáxia na seção de contato.

- Clique no sol para explorar o sistema: arraste para girar, role ou use dois dedos para aproximar, clique num planeta para ler sobre ele.
- Tudo está em `index.html`. O three.js (r128) vem do cdnjs, sem etapa de build.

## Rodando localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Deploy na Vercel

Site estático: importe o repositório com o preset "Other", sem comando de build e com a raiz como diretório de saída.
