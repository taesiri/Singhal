FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

ENTRYPOINT ["npm","start"]
CMD ["http://0.0.0.0:5001", "1","3","5","1"]