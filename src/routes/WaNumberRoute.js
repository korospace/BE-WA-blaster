// LOAD LIBS
const router = require("express").Router();
const multer = require('multer');
const path   = require('path');
const { readFile } = require('xlsx');

// CONTROLLERS
const WaNumberController = require("../controllers/WaNumberController");

// MIDDLEWARES
const authMiddleware = require('../middlewares/authMiddleware');

// VALIDATORS
const { mapperV1 } = require('../validators/ErrorsMapper');
const { createRules,updateRules,importXlsxRule } = require('../validators/WaNumberRules');

// UPLOAD SETUP
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ROUTE DEFINE
router.get("/wa_number/all", authMiddleware(['superadmin','client']), WaNumberController.getAll);
router.post(
  "/wa_number/create", 
  authMiddleware(['superadmin','client']),  
  createRules(),                   
  mapperV1,                        
  WaNumberController.create            
);
router.get("/wa_number/download_import_template", authMiddleware(['superadmin','client']), WaNumberController.downloadTemplate);
router.post(
  "/wa_number/import", 
  authMiddleware(['superadmin', 'client']),
  importXlsxRule,
  upload.single('file_xlsx'),
  WaNumberController.importExcel
);
router.put(
  "/wa_number/update", 
  authMiddleware(['superadmin','client']),  
  updateRules(),                   
  mapperV1,                        
  WaNumberController.update            
);
router.delete("/wa_number/delete/:wa_number_id", authMiddleware(['superadmin','client']), WaNumberController.delete);

module.exports = router;