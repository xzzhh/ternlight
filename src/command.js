/**
 * TernLight: Javascript Library for draw flow-chart,Based on HTML5 CANVAS API.
 * 
 * @author fancimage
 * @Copyright 2013 fancimage@gmail.com Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
 
(function(){

var Commands = tern.namespace('Commands');

var Command = tern.classdef('Command',{
  Command: function(){
    this.text = null;
  },

  toString: function(){return this.text;},
  undo: function(){},
  redo: function(){},
});

Commands.classdef('MoveCommand',Command,{
  MoveCommand: function(items,offsetX,offsetY){
    Command.call(this);
    this.list = []
    for(var i=0;i<items.length;i++) this.list[i] = items[i];
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.text = "Elements Move";
  },

  undo: function(){
    if(this.list.length <= 0 || this.list[0].parent == null ) return;
    
    this.list[0].parent.setSelectedItems(this.list);
    for(var i=0;i<this.list.length;i++){
        this.list[i].move(-this.offsetX,-this.offsetY);
    }
  },

  redo: function(){
    if(this.list.length <= 0 || this.list[0].parent == null ) return;
    
    this.list[0].parent.setSelectedItems(this.list);
    for(var i=0;i<this.list.length;i++){
        this.list[i].move(this.offsetX,this.offsetY);
    }
  },
});

Commands.classdef('CompoundCommand',Command,{
  CompoundCommand: function(){
    Command.call(this);
    this.commands = [];
  },

  addCommand: function(cmd){
    this.commands[this.commands.length] = cmd;
  },

  undo: function(){
    for(var i=0;i<this.commands.length;i++) this.commands[i].undo();
  },

  redo: function(){
    for(var i=0;i<this.commands.length;i++) this.commands[i].redo();
  },
});

Commands.classdef('BindConnectorCommand',Command,{
  BindConnectorCommand: function(child,parent,toAttach){
    Command.call(this);
    this.child = child;
    this.parent = parent;
    this.toAttach = toAttach;
    if (toAttach) this.text = 'Attache to ' + parent.parent;
    else this.text = 'Detache from ' + parent.parent;
  },

  _execute: function(flag){
    if (this.parent == null || this.child == null || !this.parent.attachable) return;
    if(flag) this.parent.addAttached(this.child);
    else this.parent.removeAttached(this.child);
  },

  undo: function(){
    this._execute(!this.toAttach);
  },

  redo: function(){
    this._execute(this.toAttach);
  },
});

Commands.classdef('ConnectorMoveCommand',Command,{
  ConnectorMoveCommand: function(ct,offsetX,offsetY){
    Command.call(this);
    
    this.ct = ct;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  },

  _execute: function(flag){
    if(this.ct == null) return;
    this.ct.parent.parent._setSelectedConnector(this.ct);
    
    var pointDrager = this.ct.beginDrag();
    if (pointDrager == null){
        if (!ct.draggable()) return;
        else if (!pointDrager.movable()){
            pointDrager.cancel();
            pointDrager = null;
        }
    }
    
    if(pointDrager != null){
        if(flag) pointDrager.move(this.offsetX,this.offsetY);
        else pointDrager.move(-this.offsetX,-this.offsetY);
    }else{
        if(flag) this.ct.move(this.offsetX,this.offsetY);
        else this.ct.move(-this.offsetX,-this.offsetY);
    }
  },

  undo: function(){
    this._execute(false);
  },

  redo: function(){
    this._execute(true);
  },
});

Commands.classdef('AddRemoveCommand',Command,{
    AddRemoveCommand: function(ctrl,list,isAdded){
        this.ctrl = ctrl;
        this.isAdded = isAdded;
        
        this.items = [];        
        if(list != null && list.length > 0){
            if (!isAdded) this.child = new Commands.CompoundCommand();
            for(var j=0;j<list.length;j++){
                var i =  list[j];
                this.items.push(i);
                
                if (!isAdded && i.connectors.length > 0){
                    for(var m=0;m<i.connectors.length;m++){
                        var ct = i.connectors[m];
                        if(ct.attachedConnectors && ct.attachedConnectors.length>0){
                            for(var n=0;n<ct.attachedConnectors.length;n++){
                                var ct2 = ct.attachedConnectors[n];
                                if(list.indexOf(ct2.parent) < 0){
                                    this.child.addCommand(new Commands.BindConnectorCommand(ct2, ct, false));
                                }
                            }
                        }else if(ct.attachTo != null){
                            var parent = ct.attachTo.parent;
                            if(list.indexOf(parent) < 0) {
                                this.child.addCommand(new Commands.BindConnectorCommand(ct,ct.attachTo, false));
                            }
                        }
                    }
                }
            }
        }
    },
    
    _execute: function(flag){
        if(this.ctrl==null || this.items.length<=0) return;
        if(flag){
            //add items to diagram
            for(var i=0;i<this.items.length;i++){
                this.ctrl.addChild( this.items[i] );
            }
            
            if (this.childs){
                this.childs.undo();
            }
            
            this.ctrl.setSelectedItems(this.items);
        }else{
            if (this.childs){
                this.childs.redo();
            }
            
            //remove
            for(var i=0;i<this.items.length;i++){
                this.ctrl.removeChild( this.items[i] );
            }
            
            this.ctrl.setSelectedItems(null);
        }
    },
    
    undo: function(){this._execute(!this.isAdded);},
    redo: function(){this._execute(this.isAdded);},
});

})();