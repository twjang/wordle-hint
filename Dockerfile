# ------------------------------------------------------------------------------
# Backend
# ------------------------------------------------------------------------------

FROM rust:latest as backend-env
RUN apt-get update && apt-get install musl-tools -y && rustup target add x86_64-unknown-linux-musl

WORKDIR /app/backend
COPY Cargo.toml Cargo.toml

RUN mkdir src/
RUN echo "fn main() {println!(\"if you see this, the build broke\")}" > src/main.rs
RUN RUSTFLAGS=-Clinker=musl-gcc cargo build --release --target=x86_64-unknown-linux-musl
RUN rm -f target/x86_64-unknown-linux-musl/release/deps/myapp*

FROM backend-env as backend-build
COPY ./backend/* ./

RUN RUSTFLAGS=-Clinker=musl-gcc cargo build --release --target=x86_64-unknown-linux-musl
RUN find /app/backend/

# ------------------------------------------------------------------------------
# Frontend 
# ------------------------------------------------------------------------------

FROM node:16.14.0-alpine3.14 AS frontend-env
WORKDIR /app/frontend
COPY ./frontend/package-lock.json ./frontend/package.json ./
RUN npm install

FROM frontend-env AS frontend-build
COPY ./frontend/* .
RUN npm run build


# ------------------------------------------------------------------------------
# Final Stage
# ------------------------------------------------------------------------------

FROM alpine:latest

WORKDIR /app/
COPY --from=backend-build /usr/local/cargo/bin/myapp /app/wordle-hint-backend
COPY --from=frontend-build /app/frontend/build /app/static

EXPOSE 8080
CMD ["myapp"]