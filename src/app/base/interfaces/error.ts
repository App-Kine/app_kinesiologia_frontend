import { HttpErrorResponse } from '@angular/common/http';

export class ErrorD {
    private error: Error;
    private context: any = {};

    constructor(data, server, service, path) {
        try {
            if (data instanceof HttpErrorResponse) {
                // ERROR SERVIDOR
                this.error = new Error(data.message);
                this.error.name = data.statusText;
                this.setContext(
                    path,
                    data.statusText,
                    'SERVER',
                    'CRITICAL',
                    data.url,
                    data.status,
                    null,
                    false
                );
            } else if (!(data instanceof Error)) {
                // ERROR SERVICIO
                this.error = new Error(data.message);
                this.error.stack =
                    data.trace == undefined
                        ? ''
                        : data.trace instanceof Object
                        ? data.trace
                        : data.trace.split('\n');
                this.setContext(
                    path,
                    service,
                    data.level,
                    data.type,
                    `${server}/${service}`,
                    200,
                    data.trace,
                    this.isTokenError(this.error.name, this.error.stack)
                );
            } else {
                // ERROR CLIENT-SIDE
                this.error = data;
                this.setContext(
                    path,
                    data.name,
                    'CLIENTE',
                    null,
                    null,
                    null,
                    data.stack,
                    false
                );
            }
            this.setMessageCustom(this.error.message);
        } catch (e) {
            this.error = e;
            this.setContext(
                path,
                e.name,
                'CLIENTE',
                null,
                null,
                null,
                e.stack,
                false
            );
            this.setMessageCustom(this.error.message);
        }
    }

    getError(): Error {
        return this.error;
    }

    setContext(path, nombre, nivel, tipo, servicio, estado, trace, token) {
        this.context = {
            path: path,
            nombre: nombre,
            nivel: nivel,
            tipo: tipo,
            servicio: servicio,
            estado: estado,
            trace: trace,
            token: token,
        };
    }

    getContext(): any {
        return this.context;
    }

    setMessageCustom(msgs) {
        this.context['message'] = msgs;
    }

    private isTokenError(message, trace): boolean {
        let msgs = message + trace.toString();
        let out = [
            'tokenError',
            'JsonWebTokenError',
            'Datos de sesión',
            'parámetro idSesion',
        ].some((i) => msgs.toString().includes(i));

        return out;
    }
}