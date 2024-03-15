import express from 'express'
import {exec} from 'child_process'
import {v2 as cloudinary} from 'cloudinary'
import 'dotenv/config'
const app = express();

// Configurar Cloudinary con variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.post('/backup', (req, res) => {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const backupFile = `backup-${formattedDate}.gz`;

  const mongodumpCommand = `mongodump --uri="${process.env.MONGO_URI}" --gzip --archive=${backupFile}`;


  const envData = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    MONGO_URI: process.env.MONGO_URI,
  };

  

  exec(mongodumpCommand, (error, stdout, stderr) => {
    if (error) {
      
      console.error(`Error al realizar el backup: ${error.message}`);
      return res.status(500).json({ message: `error backup ENVS ${JSON.stringify(envData)}` });
    }

    cloudinary.uploader.upload(backupFile, {
      resource_type: 'raw',
      folder: 'Backup de la fecha'
    }).then(result => {
      console.log(`Archivo subido con éxito a Cloudinary: ${result.url}`);
      res.status(200).json({ message: `Backup completado: ${result.url}` });
    }).catch(error => {
      console.error(`Error al subir el archivo a Cloudinary: ${error.message}`);
      res.status(500).json({ message: "Error al subir el archivo a Cloudinary" });
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
