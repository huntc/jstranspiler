organization := "com.typesafe"

name := "jstranspiler"

version := "1.0.0-SNAPSHOT"

libraryDependencies ++= Seq(
  "org.webjars" % "mkdirp" % "0.3.5",
  "org.webjars" % "when-node" % "3.2.2-SNAPSHOT"
)

resolvers ++= Seq(
  Resolver.sonatypeRepo("snapshots"),
  "Typesafe Releases Repository" at "http://repo.typesafe.com/typesafe/releases/",
  Resolver.mavenLocal
)

mappings in (Compile, packageBin) ++= Seq(
  (file("src") / "main.js").getPath,
  "package.json" 
  ) map(f => baseDirectory.value / f -> (file("META-INF") / "resources" / "webjars" / name.value / version.value / f).getPath)

crossPaths := false

publishTo := {
  val typesafe = "http://private-repo.typesafe.com/typesafe/"
  val (name, url) = if (isSnapshot.value)
                    ("sbt-plugin-snapshots", typesafe + "maven-snapshots")
                  else
                    ("sbt-plugin-releases", typesafe + "maven-releases")
  Some(Resolver.url(name, new URL(url)))
}
