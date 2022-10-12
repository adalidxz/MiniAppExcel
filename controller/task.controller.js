import * as helpers from '../helpers/task.helpers';

export const calcularEstimacionHectareaMasivo= async (req,res)=>{
    const datos = await helpers.obtenerDatos();
    res.send(`${datos.script} <br><br> /*  <br><br>${datos.notFound} <br><br>*/`)
}