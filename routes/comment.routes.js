const express = require('express');
const router = express.Router();

const Comment = require('../controllers/comments.controller');

router.get('/getAllCommentsByRecordId/:recordId', Comment.getAllCommentsByRecordId);
router.post('/addcommmet', Comment.addcommmet);


module.exports = router;
