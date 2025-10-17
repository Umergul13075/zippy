// import multer from "multer";

// const storage = multer.diskStorage({
// // then if you have selected diskStorage then in diskStorage storage where you want to save means give destination cb stands for call back , req you will recive and file as well 
//     destination: function(req, file, cb){
//         cb(null, "./public/temp")
//     },

//     filename: function(req, file, cb){
//         cb(null, file.originalname)
//     }
    
// })
// export const upload = multer({
//     storage,
// })


import multer from "multer";
import path from "path"; 
// Define the maximum file size limit in bytes (5 MB)
const FILE_SIZE_LIMIT = 5 * 1024 * 1024;

const storage = multer.diskStorage({
   
    destination: function(req, file, cb){
        cb(null, "./public/temp") 
    },

   
    filename: function(req, file, cb){
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
       
    }
    
})

export const upload = multer({
    storage,
    limits:{
        fileSize: FILE_SIZE_LIMIT
    },
});
