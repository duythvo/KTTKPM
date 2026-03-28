package main

import (
    "fmt"
    "net/http"
)

func health(w http.ResponseWriter, _ *http.Request) {
    _, _ = fmt.Fprintln(w, "ok - multi-stage image is running")
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/health", health)

    server := &http.Server{
        Addr:    ":8080",
        Handler: mux,
    }

    if err := server.ListenAndServe(); err != nil {
        panic(err)
    }
}
