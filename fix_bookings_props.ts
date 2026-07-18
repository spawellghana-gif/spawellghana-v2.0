import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '                <Bookings \n                  bookings={bookings}\n                  customers={customers}\n                  services={services}\n                  onAdd={handleAddBooking}\n                  onUpdate={handleUpdateBooking}\n                  onDelete={handleDeleteBooking}\n                />',
  '                <Bookings \n                  bookings={bookings}\n                  customers={customers}\n                  services={services}\n                  employees={employees}\n                  partners={partners}\n                  onAdd={handleAddBooking}\n                  onUpdate={handleUpdateBooking}\n                  onDelete={handleDeleteBooking}\n                />'
);

fs.writeFileSync('src/App.tsx', content);
