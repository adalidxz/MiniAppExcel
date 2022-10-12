import { Router } from "express";
import * as taskController from "../controller/task.controller"
const router = Router();

router.get("/masivo/estimacionHectarea/",taskController.calcularEstimacionHectareaMasivo);

module.exports = router;