FROM node:latest
MAINTAINER wailorman

RUN mkdir /snail
ADD . /snail
RUN cd /snail && npm install

#CMD ["node", "/snail/oauth-test.js"]