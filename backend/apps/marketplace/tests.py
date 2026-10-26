from rest_framework.test import APITestCase
from rest_framework import status
from apps.users.models import User
from apps.colleges.models import College
from apps.marketplace.models import AcademicResource, Listing


class OwnershipPermissionTests(APITestCase):
    def setUp(self):
        # Create college
        self.college = College.objects.create(
            name='Gujarat Technological University',
            code='GTU',
            city='Ahmedabad',
            state='Gujarat'
        )

        # Create two distinct users
        self.owner = User.objects.create_user(
            email='owner@example.com',
            password='Password123!',
            full_name='Owner User',
            college=self.college
        )

        self.other_user = User.objects.create_user(
            email='other@example.com',
            password='Password123!',
            full_name='Other User',
            college=self.college
        )

        # Create AcademicResource owned by self.owner
        self.resource = AcademicResource.objects.create(
            college=self.college,
            uploader=self.owner,
            title='Data Structures & Algorithms',
            author='Author Name',
            description='Test resource description',
            resource_type='BOOK',
            condition='LIKE_NEW'
        )

        # Create Listing owned by self.owner
        self.listing = Listing.objects.create(
            resource=self.resource,
            seller=self.owner,
            listing_type='SELL',
            status='AVAILABLE',
            price=250.00
        )

    def test_owner_can_patch_listing(self):
        """Owner of a listing can successfully PATCH their listing."""
        self.client.force_authenticate(user=self.owner)
        url = f'/api/v1/marketplace/listings/{self.listing.id}/'
        response = self.client.patch(url, {'price': '300.00'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.listing.refresh_from_db()
        self.assertEqual(float(self.listing.price), 300.00)

    def test_other_user_cannot_patch_listing(self):
        """Non-owner receives 403 Forbidden when attempting to PATCH someone else's listing."""
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/v1/marketplace/listings/{self.listing.id}/'
        response = self.client.patch(url, {'price': '10.00'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.listing.refresh_from_db()
        self.assertEqual(float(self.listing.price), 250.00)

    def test_other_user_cannot_delete_listing(self):
        """Non-owner receives 403 Forbidden when attempting to DELETE someone else's listing."""
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/v1/marketplace/listings/{self.listing.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Listing.objects.filter(id=self.listing.id).exists())

    def test_owner_can_delete_listing(self):
        """Owner can successfully DELETE their own listing."""
        self.client.force_authenticate(user=self.owner)
        url = f'/api/v1/marketplace/listings/{self.listing.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Listing.objects.filter(id=self.listing.id).exists())

    def test_owner_can_patch_academic_resource(self):
        """Owner (uploader) of a resource can successfully PATCH their resource."""
        self.client.force_authenticate(user=self.owner)
        url = f'/api/v1/marketplace/resources/{self.resource.id}/'
        response = self.client.patch(url, {'title': 'Updated Title'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.resource.refresh_from_db()
        self.assertEqual(self.resource.title, 'Updated Title')

    def test_other_user_cannot_patch_academic_resource(self):
        """Non-owner receives 403 Forbidden when attempting to PATCH someone else's resource."""
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/v1/marketplace/resources/{self.resource.id}/'
        response = self.client.patch(url, {'title': 'Hacked Title'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.resource.refresh_from_db()
        self.assertEqual(self.resource.title, 'Data Structures & Algorithms')

    def test_other_user_cannot_delete_academic_resource(self):
        """Non-owner receives 403 Forbidden when attempting to DELETE someone else's resource."""
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/v1/marketplace/resources/{self.resource.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(AcademicResource.objects.filter(id=self.resource.id).exists())

    def test_owner_can_delete_academic_resource(self):
        """Owner (uploader) can successfully DELETE their own resource."""
        self.client.force_authenticate(user=self.owner)
        url = f'/api/v1/marketplace/resources/{self.resource.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(AcademicResource.objects.filter(id=self.resource.id).exists())

    def test_unauthenticated_read_allowed(self):
        """Unauthenticated requests can still read resources and listings."""
        # Unauthenticated GET listings
        resp_listings = self.client.get('/api/v1/marketplace/listings/')
        self.assertEqual(resp_listings.status_code, status.HTTP_200_OK)

        # Unauthenticated GET resources
        resp_resources = self.client.get('/api/v1/marketplace/resources/')
        self.assertEqual(resp_resources.status_code, status.HTTP_200_OK)
