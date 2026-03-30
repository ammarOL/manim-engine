from manim import *

class Scene_364616dd_5757_4c78_9f7d_30e8258eb1dd(Scene):
    def construct(self):
        self.camera.background_color = "#000000"
        audi_logo = SVGMobject(file_name="audi_logo.svg")
        audi_logo.set_color("#FFFFFF")
        audi_logo.scale(2)
        audi_logo.shift(UP)
        four_rings = audi_logo.family_members_with_points()
        ring_animation = LaggedStart(
            *[
                Rotate(
                    ring,
                    about_point=ORIGIN,
                    angle=TAU,
                    rate_func=linear,
                    run_time=3,
                )
                for ring in four_rings
            ],
            lag_ratio=0.3,
        )
        self.play(FadeIn(audi_logo))
        self.play(ring_animation)
        self.wait()