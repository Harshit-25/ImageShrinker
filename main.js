const path=require('path');
const os=require('os');
const { app, BrowserWindow,Menu,ipcMain,shrinkImage, shell } = require('electron');
const imagemin=require('imagemin');
const imageminMozjpeg=require('imagemin-mozjpeg');
const imageminPngquant=require('imagemin-pngquant');
const slash=require('slash');
const log = require('electron-log');

process.env.NODE_ENV='production';

const isDev=process.env.NODE_ENV!=='production'?true:false;

const isMac=process.platform==='darwin'?true:false;

let win;
let aboutWin;

//create main window
function createWindow () {
    win = new BrowserWindow({
    width: 600,
    height: 600,
    icon:`${__dirname}/assets/icons/Icon_256x256.png`,
    resizable:isDev,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('./app/index.html')
}

//create about window
function createAboutWindow () {
    aboutWin = new BrowserWindow({
    width: 300,
    height: 300,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable:false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  aboutWin.loadFile('./app/about.html')
}


app.on('ready',()=>{
    createWindow ()
    let menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
    
    //handling garbage collection
    win.on('closed',()=>win=null)
})

//creating menu

const template=[
  ...(isMac?[
    {label: app.name,
    submenu:[
      { label:'About',
        click:createAboutWindow
    }, 
    ]}
  ]:[]),

    {
    role:'fileMenu',   
    },

   ...(!isMac?[{
     label:'Help',
     submenu:[
      { label:'About',
        click:createAboutWindow
      }
    ]}]:[]),

    ...(isDev?[{
      label:'Developer',
      submenu:[
        {role:'reload'},
        {role:'forcereload'},
        {type:'separator'},
        {role:'toggledevtools'}
      ]
    }]:[])

]

ipcMain.on('image:minimize',(e,option)=>{
  option.dest=path.join(os.homedir(),'imageshrink')
  shrinkImages(option)
})

async function shrinkImages({imgPath,quality,dest}){
  try{
    const pngQuality=quality/100
    const files = await imagemin([slash(imgPath)],{
      destination:dest,
      plugins: [
        imageminMozjpeg({quality}),
        imageminPngquant({
            quality: [pngQuality,pngQuality]
        })
    ]
    }
    
    )
    log.info(files)
    shell.openPath(dest)

    win.webContents.send('image:done')

  }catch(err){
    log.error(err)
  }
}

//Functinality for Mac
app.on('window-all-closed', () => {
    if (isMac) {
      app.quit()
    }
  })

//Functinality for Mac
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })