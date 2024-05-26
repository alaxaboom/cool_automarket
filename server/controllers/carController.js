const multer = require('multer');
const uuid = require('uuid');
const path = require('path');
const {Car, CarInfo} = require('../models/models');
const ApiError = require('../error/ApiError');

// Настройка multer для обработки одиночного файла изображения
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'static/');
  },
  filename: function (req, file, cb) {
    const fileName = uuid.v4() + path.extname(file.originalname);
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

class CarController {
    async create(req, res, next) {
        try {
            await new Promise((resolve, reject) => {
                upload.single('img')(req, res, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            let {name, price, brandId, typeId, info} = req.body;
            const fileName = req.file ? req.file.filename : null;

            const car = await Car.create({
                name,
                price,
                brandId,
                typeId,
                img: fileName
            });

            if (info) {
                info = JSON.parse(info);
                info.forEach(async (i) => {
                    await CarInfo.create({
                        title: i.title,
                        description: i.description,
                        carId: car.id
                    });
                });
            }

            return res.json(car);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }

    async getAll(req, res) {
        let {brandId, typeId, limit, page} = req.query
        page = page || 1
        limit = limit || 9
        let offset = page * limit - limit
        let cars;
        if (!brandId && !typeId) {
            cars = await Car.findAndCountAll({limit, offset})
        }
        if (brandId && !typeId) {
            cars = await Car.findAndCountAll({where:{brandId}, limit, offset})
        }
        if (!brandId && typeId) {
            cars = await Car.findAndCountAll({where:{typeId}, limit, offset})
        }
        if (brandId && typeId) {
            cars = await Car.findAndCountAll({where:{typeId, brandId}, limit, offset})
        }
        return res.json(cars) 
    }

    async getOne(req, res) {
         const {id} = req.params
        const car = await Car.findOne(
            {
                where: {id},
                include: [{model: CarInfo, as: 'info'}]
            },
        )
        return res.json(car) 
    }
}

module.exports = new CarController()