const args = require("minimist")(process.argv.slice(2))//
const { build } = require("esbuild");
 const {resolve} = require('path');
const target = args._[0] || 'reactivity';

const format = args.f || 'global';

//开发环境只打包某一个

const pkg = require(resolve(__dirname,`../packages/${target}/package.json`));
const outputFormat = format.startsWith("global")?'iife':format==='cjs'?'cjs' :'esm';
const outfile = resolve(__dirname,`../packages/${target}/dist/${target}.${format}.js`);
build({
    entryPoints:[resolve(__dirname,`../packages/${target}/src/index.ts`)],
    outfile,
    bundle:true,
    sourcemap:true,
    format:outputFormat,
    globalName:pkg.buildOptions?.name,
    platform:format==='cjs'?'node':'browser',
    watch:{
        onRebuild(err){
            if(!err){
                console.log(`rebuilt~~~`)
            }
        }
    }
}).then(()=>{
    console.log('watching');
})