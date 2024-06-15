FROM node

WORKDIR /usr/src/app

COPY ./package.json ./
RUN npm install
RUN wget https://github.com/official-stockfish/Stockfish/releases/latest/download/stockfish-ubuntu-x86-64-sse41-popcnt.tar \
&& mkdir ./stockfish/ \
&& tar -xf stockfish-ubuntu-x86-64-sse41-popcnt.tar -C ./stockfish \
&& mv ./stockfish/stockfish/stockfish-ubuntu-x86-64-sse41-popcnt ./stock \
&& rm -r ./stockfish/stockfish \
&& mv ./stock ./stockfish/stockfish

COPY ./ ./

WORKDIR ./ts_src
RUN npx tsc || :

WORKDIR ../
CMD ["node", "main.mjs"]
