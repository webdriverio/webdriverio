var cbt = require('cbt_tunnels');

export default class CrossBrowserTestingLauncher{
    onPrepare(config, capabilities) {
        if(!config.cbtTunnel){
            return;
        }


        this.cbtOpts = Object.assign({
            username: config.user,
            authkey: config.key
        }, config.cbtOpts)

        this.tunnel = cbt

        return new Promise(function(resolve, reject){
            this.tunnel.start({'username': config.user,'authkey': config.key},function(err){
                if(!err){
                    
                    return resolve();
                }else{
                    return reject(err);
                }
            });
        })
     }
    
    onComplete() {         
        return new Promise(function(resolve, reject){
            this.tunnel.stop(function(err){
                if(!err){
                    return resolve();
                }else{
                    return reject(err);
                }
            });
        })
     }
  

}

