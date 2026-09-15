#!/bin/bash
sed -i 's/import Reporting from '"'"'.\/pages\/Reporting'"'"';/import Reporting from '"'"'.\/pages\/Reporting'"'"';\nimport Team from '"'"'.\/pages\/Team'"'"';/g' src/App.tsx
sed -i 's/<Route path="\/reporting" element={<Reporting \/>} \/>/<Route path="\/reporting" element={<Reporting \/>} \/>\n            <Route path="\/team" element={<Team \/>} \/>/g' src/App.tsx
