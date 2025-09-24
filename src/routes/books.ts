import { Router } from "express";
import { listBooks } from "../controllers/bookController";

const router = Router();

router.get("/", listBooks);

export default router;
