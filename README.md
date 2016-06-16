# SystemLite-dashboard

Dashboard for monitoring and describing a multicontainer/multihost application. Create graphical representations of complex deployments by dragging nodes onto the canvas and creating network linkages between them.

![](http://i.imgur.com/95GK0jf.png)

Current configuration management platforms are subject to limitations imposed by outdated deployment practices. Tools like UrbanCode Deploy, Ansible, Puppet, and Chef are held back by the sheer scale of what they try to accomplish. Simply put, managing the state of long lived machines is an unsustainable practice which will inevitably run into unforeseeable bugs or incompatibilities.

The goals of deployment should align more closely with the goals of software development itself. Environments should be encapsulated, organized, and most importantly, immediately reproducible. Fortunately the technology to accomplish this
goal has existed for some time now. Linux containers, namely “Docker”, allow DevOps
Engineers to create discrete isolated components which are guaranteed to run consistently each time, regardless of host distribution.

What are the implications of Linux containers with regards to configuration management? A configuration management tool designed with containers as first class citizens can be substantially more streamlined than current solutions. The configuration management tool would no longer responsible for managing a series of complex intertwined operations. Instead the configuration management tool could focus on what matters: describing what components make up an application, and how these components interact.

SystemLite aims to make the configuration management process as explicit as possible. There are no runbooks or procedures. Instead, SystemLite uses components. Each component is a single isolated docker container. Each component is represented visually on a canvas and can be connected to other components. Each connection represents a network linkage between the containers. This system has the effect of producing a graphical flow-chart which is directly tied to the behavior of the deployment, and the result is an extremely portable description of a complex application or service.

![](http://i.imgur.com/Xvj1WE9.png)
*Sample dashboard*
