FROM node:current-alpine
WORKDIR /
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "run", "dev"]