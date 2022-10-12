
import XLSX from 'xlsx';
import moment from 'moment';
import * as fn from './funciones';
//

const files = ["Arandas.xlsx",'CBAxlsx.xlsx','Gomez Farias.xlsx','mazamitla.xlsx','tepatitlan.xlsx','zapotalan jlsv.xlsx','Zapotiltic.xlsx'];

function leerExcel(ruta){

    const workbook = XLSX.readFile(ruta);
    const workbookSheets = workbook.SheetNames;
    const sheet = workbookSheets[0];
    const dataExcel  = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
    return {datos:dataExcel, name: ruta.toString().replace(".xlsx","").replace("files/","")};
}

const tabla = async (path)=>{
    const {datos, name} = leerExcel(`files/${path}`);
    const datosRequeridos = datos.map(e=>{
            return {
                sader:e.SADER, 
                ha: e.Hectáreas, 
                pdc:e['Pronóstico de Cosechas'], 
                in: Math.round(e['Pronóstico de Cosechas']/e.Hectáreas)*1000, 
                edad: e['Edad Huerto'] ? parseInt(e['Edad Huerto'].replace(' años','')): null
            }
        });
    
    for (const key in datosRequeridos) {
        if (Object.hasOwnProperty.call(datosRequeridos, key)) {
            const e = datosRequeridos[key];
            e.in = (e.in == 0 ? 10000 : e.in);
            const _db = await fn.getSuperficie(e.sader);
            e._existe = (_db !== undefined ? true : false);
            e._superficie = _db ? _db.Superficie : null;
            e._edadHuerto = _db ? _db.EdadHuerto : null;
            e._SupDiff = (_db ? (_db.Superficie !== e.ha ? true : false) : false);
            e.edadExcel = moment().subtract(e.edad,"years").format("Y-MM-DD HH:mm:ss");
            e.edadDiff = (!e._edadHuerto ? true : false);
        }
    }
    return {name: name, datos: datosRequeridos};
}

export const obtenerDatos = async ()=>{
    const datosPintar = [];
    for (const key in files) {
        if (Object.hasOwnProperty.call(files, key)) {
            const val = files[key];
            const datos = await tabla(val);
            datosPintar.push(datos);
        }
    }
    const querySQL = [];
    const querySQL_NotFound =[];
    querySQL.push("USE cosechas<br><br>BEGIN TRAN <br><br><br> DECLARE @IdHuerta INT;");
    for (const key in datosPintar) {
        if (Object.hasOwnProperty.call(datosPintar, key)) {
            const val = datosPintar[key];
            querySQL.push(`/* =========================================================================== ${val.name} ===================================================================*/`);
            for (const k2 in val.datos) {
                if (Object.hasOwnProperty.call(val.datos, k2)) {
                    const val2 = val.datos[k2];
                    const edadCalculada = (val2._edadHuerto !== null ? ( val2._edadHuerto !== "1900-01-01 00:00:00" ? val2._edadHuerto : val2.edadExcel) :  val2.edadExcel);
                    if(val2._existe===false){
                        querySQL_NotFound.push(`${val2.sader} no encontrado en la base de datos;`);
                    }else if(val2._SupDiff===true){ 
                        const EstimadoHectarea = Math.round((val2.pdc / val2._superficie)*1000);
                        
                        querySQL.push(`/*<br>
                        &nbsp;Superficie diferente entre excel y SICOA <br>
                        &nbsp;&nbsp;Excel: ${val2.ha} <br>
                        &nbsp;&nbsp;SICOA: ${val2._superficie} <br>
                        &nbsp;${val2.pdc === 0 ? ` Pronostico de cosecha en 0 Excel` : ''} <br>
                        &nbsp; Edad Excel: ${val2.edad} años <br>
                        &nbsp; Edad BD: ${val2._edadHuerto} años <br>
                        &nbsp; Edad Calculada: ${edadCalculada} años <br>
                        &nbsp; Fecha Referencia: ${moment("2022-06-24 00:00:00").format("Y-MM-DD HH:mm:ss")} <br>
                        &nbsp; Estimado Hectarea Excel: ${val2.in}
                        &nbsp; Estimado Hectarea Calculada: ${(EstimadoHectarea === 0 ? 10000 : EstimadoHectarea )}<br>
                        */<br>`);
                        querySQL.push(`
                                    SET @IdHuerta = (SELECT IdHuerta FROM HUE_Huertas WHERE SAGARPA='${val2.sader}');<br><br>
                                    PRINT @IdHuerta;<br><br>
                                    IF EXISTS (SELECT * FROM HUE_Huertas WHERE SAGARPA='${val2.sader}')<br>
                                        &nbsp;BEGIN<br>
                                        &nbsp;&nbsp;UPDATE HUE_Huertas SET Estimado_Hectareas = ${(EstimadoHectarea === 0 ? 10000 : EstimadoHectarea )} , EdadHuerto=CAST('${edadCalculada}' as date) WHERE SAGARPA='${val2.sader}';<br>
                                        &nbsp;END<br>
                                        IF EXISTS (SELECT * FROM CtrlEstimadoHectareasHuerta WHERE IdHuerta = @IdHuerta AND IdPrograma = 24) <br>
                                        &nbsp;BEGIN<br>
                                        &nbsp;&nbsp;UPDATE  CtrlEstimadoHectareasHuerta SET 
                                            NvoPromedioEstimadoToneladasFinal=${(EstimadoHectarea === 0 ? 10000 : EstimadoHectarea )} ,
                                            DifEstimadoHectarea = (CtrlEstimadoHectareasHuerta.EstimadoHectariasAct - ${(EstimadoHectarea === 0 ? 10000 : EstimadoHectarea )}) 
                                        
                                            WHERE IdHuerta = @IdHuerta AND IdPrograma = 24;<br>
                                        &nbsp;END<br>
                                        ELSE<br>
                                        &nbsp;BEGIN<br>
                                        &nbsp;&nbsp; PRINT 'No se encontro en tabla CtrlEstimadoHectareasHuerta';<br>
                                        &nbsp;END<br>
                                        
                                        `);
                    }else{
                        querySQL.push(`/*<br>
                        &nbsp;${val2.in === 0 ? `Valor estimado hectarea Excel en 0` : ''} <br>
                        &nbsp; Edad Excel: ${val2.edad} años <br>
                        &nbsp; Edad BD: ${val2._edadHuerto} años <br>
                        &nbsp; Edad Calculada: ${edadCalculada} años <br>
                        &nbsp; Fecha Referencia: ${moment("2022-06-24 00:00:00").format("Y-MM-DD HH:mm:ss")} <br>
                        &nbsp; Estimado Hectarea Excel: ${val2.in}<br>
                        */<br>`);
                        querySQL.push(`
                        SET @IdHuerta = (SELECT IdHuerta FROM HUE_Huertas WHERE SAGARPA='${val2.sader}');<br><br>
                        PRINT @IdHuerta;<br><br>
                        IF EXISTS (SELECT * FROM HUE_Huertas WHERE SAGARPA='${val2.sader}')<br>
                                        &nbsp;BEGIN<br>
                                        &nbsp;&nbsp;UPDATE HUE_Huertas SET Estimado_Hectareas = ${val2.in}, EdadHuerto=CAST('${edadCalculada}' as date) WHERE SAGARPA='${val2.sader}';<br>
                                        &nbsp;END;<br>
                                        
                                        IF EXISTS (SELECT * FROM CtrlEstimadoHectareasHuerta WHERE IdHuerta = @IdHuerta AND IdPrograma = 24) <br>
                                        BEGIN <br>
                                            UPDATE  CtrlEstimadoHectareasHuerta SET 
                                                NvoPromedioEstimadoToneladasFinal=${(val2.in === 0 ? 10000 : val2.in )},
                                                DifEstimadoHectarea = (CtrlEstimadoHectareasHuerta.EstimadoHectariasAct - ${(val2.in === 0 ? 10000 : val2.in )}) 
                                            WHERE IdHuerta = @IdHuerta AND IdPrograma = 24; <br>
                                        END<br>
                                        ELSE<br>
                                        &nbsp;BEGIN<br>
                                        &nbsp;&nbsp; PRINT 'No se encontro en tabla CtrlEstimadoHectareasHuerta';<br>
                                        &nbsp;END<br>`);
                    }
                    
                }
            }
        }
    };
    querySQL.push("<br> SELECT * FROM HUE_Huertas WHERE SAGARPA LIKE '%HUE0814%'; <br> ROLLBACK; <br><br> -- COMMIT TRAN; <br><br> SELECT * FROM HUE_Huertas WHERE SAGARPA LIKE '%HUE0814%'; <br>");
    return {script: querySQL.join("<br>"), notFound: querySQL_NotFound.join("<br>")};
}