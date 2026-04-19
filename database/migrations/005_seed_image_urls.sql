UPDATE tractor
SET image_url = CASE
  WHEN brand = 'John Deere' AND model = '5075E' THEN 'https://storage.googleapis.com/maqagr-143f3.firebasestorage.app/tractors/john-deere-5075e.jpg'
  WHEN brand = 'Massey Ferguson' AND model = '4709' THEN 'https://storage.googleapis.com/maqagr-143f3.firebasestorage.app/tractors/massey-ferguson-4709.jpg'
  WHEN brand = 'New Holland' AND model = 'TT3.55' THEN 'https://storage.googleapis.com/maqagr-143f3.firebasestorage.app/tractors/new-holland-tt3-55.jpg'
  ELSE image_url
END;

UPDATE implement
SET image_url = CASE
  WHEN implement_name = '3-body disc plow' THEN 'https://storage.googleapis.com/maqagr-143f3.firebasestorage.app/implements/disc-plow-3-body.jpg'
  WHEN implement_name = '20-disc harrow' THEN 'https://storage.googleapis.com/maqagr-143f3.firebasestorage.app/implements/disc-harrow-20.jpg'
  WHEN implement_name = '5-row seeder' THEN 'https://storage.googleapis.com/maqagr-143f3.firebasestorage.app/implements/seeder-5-row.jpg'
  ELSE image_url
END;
