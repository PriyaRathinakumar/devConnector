const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../Models/Post');
const profile = require('../../Models/Profile');
const User = require('../../Models/User');
const { isValidObjectId } = require('mongoose');

// @route   POST api/Posts
// @desc    Create a post
// @access  private 
router.post('/', [auth, [
    check('text', 'Text is required').notEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });

    }
    try {
        const user = await User.findById(req.user.id).select('-password');
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });
        const post = await newPost.save();
        res.json(post)

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/Posts
// @desc    GET all posts
// @access  private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET api/Posts/:id
// @desc    GET posts by id
// @access  private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) { return res.status(404).json({ msg: 'Post not found' }); }
        res.json(post);
    } catch (error) {
        if (error.kind == 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELTE api/Posts/:id
// @desc    DELETE posts by id
// @access  private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        //check the user 
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        await post.remove();
        if (!post) { return res.status(404).json({ msg: 'Post not found' }); }
        res.json({ msg: 'Post removed' });
    } catch (error) {
        if (error.kind == 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/Posts/like/:id 
// @desc    Like a post
// @access  private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        // check if the post has been already liked by the user
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            res.status(400).json({ msg: 'Post already liked' });
        }
        post.likes.unshift({ user: req.user.id });
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/Posts/like/:id 
// @desc    Like a post
// @access  private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        // check if the post has been already liked by the user
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            res.status(400).json({ msg: 'Post has not yet been liked' });
        }

        // get remove Index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/Posts/comments/:id
// @desc    comment on a post
// @access  private 
router.post('/comment/:id', [auth, [
    check('text', 'Text is required').notEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);
        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };
        post.comments.unshift(newComment);
        await post.save();
        res.json(post.comments);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   DELETE api/Posts/comments/:id/:comment_id
// @desc    Delete comment on a post
// @access  private 
router.delete('comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // make sure comments exist
        if (!comment) return res.status(404).json({ msg: 'Comment doesnt exist' });

        //check the user 
        if (comment.user.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'User not authorized' });
        }
        // get remove Index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);

        await post.save();

        res.json({ msg: 'Comment  removed' });
    } catch (error) {
        if (error.kind == 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;