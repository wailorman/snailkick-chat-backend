FROM node:latest
MAINTAINER wailorman

RUN mkdir /snail
ADD . /snail
RUN cd /snail && npm install

EXPOSE 27017
EXPOSE 1515

CMD ["node", "/snail/oauth-test.js"]