import express from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';

const app = express();

app.use(express.json());

const client = await createClient()
    .on('error', (err) => console.log('Redis Client Error', err))
    .connect();

mongoose.connect('mongodb://root:root@localhost:27017/node_cache?authSource=admin');

const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    category: String,
    specs: Object,
});

const Product = mongoose.model('Product', productSchema);

app.get('/api/products', async (req, res) => {
    const key = generateCacheKey(req);

    const cachedProducts = await client.get(key);
    if (cachedProducts) {
        console.log('Cache hit');
        res.json(JSON.parse(cachedProducts));
        return;
    }
    console.log('Cache miss');

    const query = {};
    if (req.query.category) {
        query.category = req.query.category;
    }

    const products = await Product.find(query);

    if (products.length) {
        await client.set(key, JSON.stringify(products));
    }

    res.json(products);
});

function generateCacheKey(req) {
    const baseUrl = req.path.replace(/^\/+|\/+$/g, '').replace(/\//g, ':');
    const params = req.query;
    const sortedParams = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&');

    return sortedParams ? `${baseUrl}:${sortedParams}` : baseUrl;
}

app.put('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    const updateData = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $set: updateData },
        { new: true }
    );

    if (!updatedProduct) {
        return res.status(404).json({
            success: false,
            message: 'Product not found',
        });
    }

    const listCacheKey = 'api:products*';
    const keys = await client.keys(listCacheKey);
    if (keys.length > 0) {
        await client.del(keys);
    }

    res.json({
        success: true,
        message: 'Product updated successfully',
    });
});

app.listen(4000, () => console.log('Server listening on port 4000'));
