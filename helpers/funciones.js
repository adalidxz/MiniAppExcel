import sql from 'mssql';
import {config} from '../config/config';

import moment from 'moment';
export const getSuperficie = async(sader)=>{
	const query = `SELECT TOP 1 Superficie, EdadHuerto FROM HUE_Huertas WHERE SAGARPA='${sader}';`;
    try {
		const pool = await sql.connect(config);
		const data = await pool.request().query(query);
		return data.recordset.map(e=>{ return {...e,EdadHuerto: (e.EdadHuerto ? moment(e.EdadHuerto).utc().format("Y-MM-DD HH:mm:ss") : null)} })[0];
	} catch (error) {
		return null;
	}

}

export const getHuertas = async ()=>{
    const query = `SELECT TOP 100 SAGARPA, Estimado_Hectareas, EdadHuerto FROM HUE_Huertas;`;
    try {
		const pool = await sql.connect(config);
		const data = await pool.request().query(query);
		return data.recordset;
	} catch (error) {
		console.log(error);
	}
}