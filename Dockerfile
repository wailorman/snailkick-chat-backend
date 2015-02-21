FROM node:latest
MAINTAINER wailorman

RUN mkdir /snail
ADD . /snail
WORKDIR /snail
RUN npm install

ENV MONGO_HOST node:qwerty155@ds037601.mongolab.com:37601

EXPOSE 27017
EXPOSE 1515:1515

CMD ["node", "oauth-test.js"]