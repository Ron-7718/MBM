"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/login', (req, res) => {
    res.json({ message: 'login not implemented yet' });
});
router.post('/register', (req, res) => {
    res.json({ message: 'register not implemented yet' });
});
exports.default = router;
