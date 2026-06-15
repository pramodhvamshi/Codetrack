require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log("CLOUDINARY_URL loaded:", !!process.env.CLOUDINARY_URL);

// Set up a mock PDF buffer (simple empty PDF structure)
const mockPdfBuffer = Buffer.from('%PDF-1.5\n%\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000015 00000 n\n0000000072 00000 n\ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n120\n%%EOF');

async function testUpload(resourceType, useFormat) {
  return new Promise((resolve, reject) => {
    const options = {
      folder: 'medha-code-track/test-resumes',
      resource_type: resourceType,
      public_id: `test-resume-${Date.now()}`
    };
    if (useFormat) {
      options.format = 'pdf';
    }
    
    console.log(`\nUploading with options:`, options);
    
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error(`Upload error:`, error);
          return reject(error);
        }
        console.log(`Cloudinary Upload Result (resource_type=${resourceType}, useFormat=${useFormat}):`);
        console.log(result);
        resolve(result);
      }
    );
    uploadStream.end(mockPdfBuffer);
  });
}

async function run() {
  try {
    // Test 1: resource_type = 'raw', no format
    const res1 = await testUpload('raw', false);
    
    // Test 2: resource_type = 'raw', with format = 'pdf'
    const res2 = await testUpload('raw', true);

    // Test 3: resource_type = 'image', with format = 'pdf'
    const res3 = await testUpload('image', true);
  } catch (err) {
    console.error('Test run failed:', err);
  }
}

run();
