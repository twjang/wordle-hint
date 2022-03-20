# ------------------------------------------------------------------------------
# Backend
# ------------------------------------------------------------------------------

FROM rust:latest as backend-env
RUN rustup toolchain install nightly
RUN rustup default nightly

WORKDIR /app/backend
COPY ./backend/Cargo.toml Cargo.toml

RUN mkdir src/
RUN echo "fn main() {println!(\"if you see this, the build broke\")}" > src/main.rs
RUN cargo build --release
RUN rm -f target/release/wordle*

FROM backend-env as backend-build
COPY ./backend/src /app/backend/src
COPY ./backend/dict /app/backend/dict

RUN touch ./src/main.rs && cargo build --release
RUN ls /app/backend/target/release/

# ------------------------------------------------------------------------------
# Frontend 
# ------------------------------------------------------------------------------

FROM node:16.14.0-alpine3.14 AS frontend-env
WORKDIR /app/frontend
COPY ./frontend/package-lock.json ./frontend/package.json ./
RUN npm install

FROM frontend-env AS frontend-build
COPY ./frontend/ /app/frontend/
RUN npm run build


# ------------------------------------------------------------------------------
# Final Stage
# ------------------------------------------------------------------------------

FROM debian:buster-slim

WORKDIR /app/
COPY ./backend/dict/ /app/dict/
COPY --from=backend-build /app/backend/target/release/wordle-solve-backend /app/wordle-hint-backend
COPY --from=frontend-build /app/frontend/build /app/static

EXPOSE 8080
CMD ["/app/wordle-hint-backend"]
