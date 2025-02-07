const Radiologist = require('../models/Radiologists.Model');



class RadiologistController{
     //Get all rodiologists 
     async getAllRadiologists(req, res) {
          try {
               const {
                    specialization,
                    status,
                    available,
                    search,
                    limit = 10,
                    page = 1
                  } = req.body;

                  let query = {};

                  if (specialization) query.specialization = specialization;
                  if (status) query.status = status;
                  if (search) query.$text = {$text: search};
                  if (available === 'true') {
                    const currentTime = new Date().toTimeString().slice(0, 5);
                    query.status = 'Active';
                    query['availableHours.start'] = { $lte: currentTime };
                    query['availableHours.end'] = { $gte: currentTime };
                  }
                  const skip = (page - 1) * limit;

                  const [radiologists, total] = await Promise.all([
                    Radiologist.find(query)
                      .populate('centerId', 'name address')
                      .skip(skip)
                      .limit(parseInt(limit))
                      .select('-passwordHash'),
                    Radiologist.countDocuments(query)
                  ]);

                  res.json({
                    radiologists,
                    pagination: {
                      total,
                      page: parseInt(page),
                      pages: Math.ceil(total / limit)
                    }
                  });
                } catch (error) {
                  res.status(500).json({ message: error.message });
                }
              }



      // Get single radiologist by ID
     
              


}

module.exports = new RadiologistController();