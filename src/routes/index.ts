import { Hono } from 'hono'
import status    from './v1/status'
import dolar     from './v1/dolar'
import historico from './v1/historico'
import inflacion from './v1/inflacion'
import bcra      from './v1/bcra'
import cedears   from './v1/cedears'
import crypto    from './v1/crypto'
import convertir from './v1/convertir'

const v1 = new Hono()

v1.route('/status',    status)
v1.route('/dolar',     historico)   // mounted FIRST: /historico (global) y /:tipo/historico
v1.route('/dolar',     dolar)       // mounted SECOND: / y /:tipo (no intercepta /historico)
v1.route('/inflacion', inflacion)
v1.route('/bcra',      bcra)
v1.route('/cedears',   cedears)
v1.route('/crypto',    crypto)
v1.route('/convertir', convertir)

export default v1
