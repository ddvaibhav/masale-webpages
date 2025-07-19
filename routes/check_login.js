function check_login(req,res,next){
    if(req.session && req.session.user){
        next();
    }
        else{
            res.redirect("/");
        }
    };

    module.exports = check_login;
