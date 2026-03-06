#nvm use 20.19.4
#npm install -g firebase-tools
#firebase login
rm -r dist
# export NEXT_PUBLIC_BUILD_ENV=production
# echo build with env=$NEXT_PUBLIC_BUILD_ENV
yarn build
rm -f firebase.json
ln -s firebase.prd.json firebase.json
firebase deploy --only hosting:xbyte-prod
